// Application-wide constants
// Centralized location for magic numbers and configuration values

export const CANVAS = {
  TOOLBAR_HEIGHT: 64,
  DEFAULT_DIMENSIONS: {
    WIDTH: 800,
    HEIGHT: 600,
  },
} as const;

export const SHAPES = {
  DEFAULT_SIZES: {
    rectangle: { width: 120, height: 80 },
    circle: { width: 100, height: 100 }, // Diameter
    text: { width: 100, height: 30 },
  },
  DEFAULT_TEXT: "New Text",
  DEFAULT_FONT_SIZE: 16,
} as const;

export const TIMING = {
  CURSOR_DEBOUNCE_MS: 30, // Increased from 15ms to reduce network traffic while maintaining smooth feel
  LOCK_STALE_THRESHOLD_MS: 10000, // Matches LOCK_TIMEOUT_MS in lock.types.ts
  RETRY_MAX_DELAY_MS: 30000,
  RETRY_BASE_DELAY_MS: 1000,
} as const;

export const TEXT_EDITOR = {
  BORDER_WIDTH: 1,
  MIN_LINE_HEIGHT_MULTIPLIER: 1.5,
  AUTO_RESIZE_PADDING: 3,
} as const;

export const AI = {
  // Shape creation limits
  MAX_SHAPES_PER_BATCH: 500,
  MIN_SHAPES_PER_BATCH: 1,

  // Default positions for AI-created shapes
  DEFAULT_SHAPE_X: 400,
  DEFAULT_SHAPE_Y: 300,

  // Default sizes for AI-created shapes (different from user-created)
  DEFAULT_SIZES: {
    rectangle: { width: 200, height: 150 },
    circle: { width: 150, height: 150 },
    text: { width: 200, height: 50 },
  },

  // Batch creation grid layout
  BATCH_GRID_COLUMNS: 10,
  BATCH_GRID_OFFSET_X: 20,
  BATCH_GRID_OFFSET_Y: 20,

  // Layout operations
  DEFAULT_SPACING: 50,

  // API configuration
  MAX_STREAM_DURATION_SECONDS: 30,
  MAX_TOOL_CALLING_STEPS: 5,
  MAX_COLORS_IN_SUMMARY: 5,
} as const;
