import { PHYSICS } from './physics-constants';

/**
 * Configuración global del juego - Jump King Tower Mode
 *
 * TODAS las configuraciones que afectan gameplay deben estar aquí.
 * Esto evita bugs como el Y clamp que bloqueaba al jugador de subir.
 *
 * @example
 * // En cualquier servicio:
 * import { GAME_CONFIG } from '../constants/game-config';
 * const playerWidth = GAME_CONFIG.PLAYER.COLLISION_WIDTH;
 */
export const GAME_CONFIG = {
  // Modo de juego
  MODE: 'tower' as const, // 'tower' | 'classic'

  // Dimensiones del viewport (6x10 tiles)
  VIEWPORT: {
    WIDTH: 384,   // 6 tiles * 64px
    HEIGHT: 640,  // 10 tiles * 64px
  },

  // Configuración del jugador
  PLAYER: {
    // Dimensiones visuales (sprite 128x128 escalado a 0.75)
    VISUAL_WIDTH: 96,
    VISUAL_HEIGHT: 96,
    // Collision box (más pequeño que visual para mejor feel)
    COLLISION_WIDTH: 48,
    COLLISION_HEIGHT: 80,
    // Offsets para centrar collision box en sprite
    COLLISION_OFFSET_X: 24,  // (96-48)/2
    COLLISION_OFFSET_Y: 16,  // Empieza más abajo para dar espacio a la cabeza
  },

  // Límites del mundo
  WORLD_BOUNDS: {
    // En modo torre: sin límite vertical (null = sin límite)
    // Esto permite al jugador subir a secciones superiores (y < 0)
    MIN_Y: null as number | null,  // null = permitir subir indefinidamente
    MAX_Y: null as number | null,  // null = permitir caer (respawn manejado por TowerService)
    // Horizontal siempre limitado al viewport
    MIN_X: 0,
    MAX_X: 384,
  },

  // Torre (solo aplica en modo torre)
  TOWER: {
    SECTION_HEIGHT: 640,
    SECTION_COUNT: 5,
    // Los Y offsets se calculan automáticamente en TowerService:
    // hero: 0, about: -640, skills: -1280, projects: -1920, contact: -2560
  },

  // Cámara
  CAMERA: {
    DEAD_ZONE_TOP: 200,     // Pixels desde arriba antes de que la cámara siga
    DEAD_ZONE_BOTTOM: 300,  // Pixels desde abajo antes de que la cámara siga
    SMOOTHNESS: 0.12,       // Factor de interpolación (0-1, mayor = más rápido)
  },

  // Detección de colisiones
  COLLISION: {
    TERRAIN_MARGIN_X: 4,        // Margen horizontal para reducir hitbox del terreno
    TERRAIN_MARGIN_BOTTOM: 8,   // Margen inferior
    GROUND_SENSOR_HEIGHT: 2,    // Altura del sensor de suelo
    WALL_SENSOR_WIDTH: 4,       // Ancho del sensor de pared
    WALL_SENSOR_MARGIN: 8,      // Margen vertical para evitar detectar suelo como pared
  },

  // Interacción con NPCs y exits
  INTERACTION: {
    EXIT_CLOSE_THRESHOLD: 40,   // Distancia para activar exit automáticamente
    EXIT_FAR_THRESHOLD: 80,     // Distancia para activar exit cuando está parado
    NPC_INTERACTION_RADIUS: 32, // Radio de interacción con NPCs
  },

  // Input (joystick virtual y teclado)
  INPUT: {
    JOYSTICK_DEADZONE_X: 0.3,      // Zona muerta horizontal del joystick
    JOYSTICK_DEADZONE_Y: 0.5,      // Zona muerta vertical (para subir/bajar escaleras)
    MIN_VELOCITY_THRESHOLD: 0.1,   // Velocidad mínima antes de parar
  },
} as const;

// Type helpers
export type GameConfig = typeof GAME_CONFIG;
export type GameMode = typeof GAME_CONFIG.MODE;
