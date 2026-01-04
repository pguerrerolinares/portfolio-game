import { WorldSection } from '../../models/world.model';
import { TILE, PAGE_WIDTH, PAGE_HEIGHT, GROUND_Y, LEVEL, terrain } from './section-utils';

/**
 * PROJECTS SECTION - Gaps Peligrosos
 * Theme: sand/desert
 * NPC: Mouse (projects)
 * Difficulty: ⭐⭐⭐⭐ (Hard)
 *
 * TOWER MODE: Plataformas dispersas con gaps grandes
 * Requiere saltos precisos con charge completo
 * Un fallo significa caer varias plataformas
 *
 * Layout (Dangerous Gaps):
 *  Y=64              ██              ← Salida hacia CONTACT (1 tile)
 *  Y=160 ████                        ← Plataforma izquierda alta
 *  Y=288                 ████████    ← Plataforma derecha
 *  Y=384     ████████ 🐭             ← NPC Mouse
 *  Y=480 ████████████                ← Plataforma amplia baja
 *  Y=576 ████            ████████████ ← Ground dividido (hueco centro)
 *              ↑ entrada desde SKILLS
 */
export const PROJECTS_SECTION: WorldSection = {
  id: 'projects',
  width: PAGE_WIDTH,
  height: PAGE_HEIGHT,
  groundLevel: GROUND_Y,
  terrainType: 'sand',
  backgroundType: 'desert',
  terrain: [
    // Ground dividido (hueco centro para entrada desde SKILLS exit)
    ...terrain(0, 1, GROUND_Y, 'terrain_sand', 'projects_ground_l', 'left'),
    ...terrain(TILE * 4, 2, GROUND_Y, 'terrain_sand', 'projects_ground_r', 'right'),

    // P1 (left-center wide) - y=480, salto corto desde ground
    ...terrain(0, 3, LEVEL.L1 - 16, 'terrain_sand', 'projects_p1', 'left'),

    // P2 (center-left) - y=384, NPC aquí
    ...terrain(TILE, 2, LEVEL.L3 + 32, 'terrain_sand', 'projects_p2'),

    // P3 (far right) - y=288, gap peligroso
    ...terrain(TILE * 4, 2, LEVEL.L4 + 32, 'terrain_sand', 'projects_p3', 'right'),

    // P4 (left) - y=160, requiere salto preciso
    ...terrain(0, 1, LEVEL.L6, 'terrain_sand', 'projects_p4', 'left'),

    // Exit platform (center) - y=64
    ...terrain(TILE, 2, LEVEL.L8, 'terrain_sand', 'projects_exit'),
  ],
  decorations: [
    // Cactus on ground (parte derecha)
    { id: 'projects_cactus1', x: TILE * 5, y: GROUND_Y - 32, frame: 'cactus', sheet: 'tiles' },
  ],
  enemies: [],
  items: [],
  // No exits in tower mode - player jumps to next section
  exits: [],
  ladders: [],
  npcs: [
    {
      id: 'projects_mouse',
      x: TILE + 16, // On P2
      y: LEVEL.L3 + 32 - TILE, // On top of platform
      sprite: 'mouse',
      name: 'npcs.mouse.name',
      dialogue: [
        'npcs.projects.mouse.line1',
        'npcs.projects.mouse.line2',
        'npcs.projects.mouse.line3',
      ],
      patrolMinX: TILE + 8,
      patrolMaxX: TILE * 3 - 48,
      patrolSpeed: 0.4,
      externalLink: 'https://github.com/pjhartwig',
    },
  ],
  entry: {
    x: TILE * 2, // Spawn center on ground
    type: 'fall',
    direction: 'right',
  },
  title: 'sections.projects.title',
};
