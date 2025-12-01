import type { KRD, Logger } from "@kaiord/core";

/**
 * Format descriptor for a plugin-supported format
 */
export type PluginFormat = {
  /** File extension (e.g., ".gpx", ".hrm") */
  extension: string;

  /** MIME type (optional, e.g., "application/gpx+xml") */
  mimeType?: string;

  /** Human-readable description */
  description: string;
};

/**
 * Core plugin interface that all Kaiord plugins must implement
 */
export type KaiordPlugin = {
  /** Plugin name (should match package name) */
  name: string;

  /** Plugin version (semver) */
  version: string;

  /** Plugin description */
  description: string;

  /** Plugin author (optional) */
  author?: string;

  /** Plugin homepage URL (optional) */
  homepage?: string;

  /** Supported formats */
  formats: Array<PluginFormat>;

  /** Compatible Kaiord version range (semver) */
  kaiordVersion: string;

  /**
   * Convert from plugin format to KRD
   * @param input - Raw file content (binary or text)
   * @param options - Plugin-specific options
   * @returns KRD representation
   */
  toKrd: (input: Uint8Array | string, options?: unknown) => Promise<KRD>;

  /**
   * Convert from KRD to plugin format
   * @param krd - KRD representation
   * @param options - Plugin-specific options
   * @returns Raw file content (binary or text)
   */
  fromKrd: (krd: KRD, options?: unknown) => Promise<Uint8Array | string>;

  /**
   * Optional initialization hook called when plugin is loaded
   * @param logger - Logger instance for plugin use
   */
  initialize?: (logger: Logger) => Promise<void>;

  /**
   * Optional cleanup hook called when plugin is unloaded
   */
  cleanup?: () => Promise<void>;
};

/**
 * Plugin metadata discovered during plugin scanning
 */
export type PluginMetadata = {
  /** Plugin name */
  name: string;

  /** Plugin version */
  version: string;

  /** Path to plugin module */
  path: string;

  /** Whether plugin is enabled */
  enabled: boolean;

  /** Plugin-specific configuration options */
  options?: Record<string, unknown>;
};

/**
 * Plugin validation result
 */
export type PluginValidationResult = {
  /** Whether plugin is valid */
  valid: boolean;

  /** Error message if invalid */
  error?: string;

  /** Warning messages (non-fatal) */
  warnings?: Array<string>;
};

/**
 * Plugin discovery service interface
 */
export type PluginDiscovery = {
  /**
   * Discover all available plugins from standard locations
   * @returns Array of plugin metadata
   */
  discoverPlugins: () => Promise<Array<PluginMetadata>>;

  /**
   * Load a plugin from a specific path
   * @param path - Path to plugin module
   * @returns Loaded plugin instance
   */
  loadPlugin: (path: string) => Promise<KaiordPlugin>;

  /**
   * Validate a plugin structure and compatibility
   * @param plugin - Plugin to validate
   * @returns Validation result
   */
  validatePlugin: (plugin: KaiordPlugin) => PluginValidationResult;
};

/**
 * Plugin registry service interface
 */
export type PluginRegistry = {
  /**
   * Register a plugin
   * @param plugin - Plugin to register
   */
  register: (plugin: KaiordPlugin) => void;

  /**
   * Unregister a plugin by name
   * @param name - Plugin name
   */
  unregister: (name: string) => void;

  /**
   * Get plugin that handles a specific format
   * @param format - File extension (e.g., ".gpx")
   * @returns Plugin instance or undefined
   */
  getPlugin: (format: string) => KaiordPlugin | undefined;

  /**
   * List all registered plugins
   * @returns Array of registered plugins
   */
  listPlugins: () => Array<KaiordPlugin>;

  /**
   * Check if a format is supported by any plugin
   * @param format - File extension (e.g., ".gpx")
   * @returns True if format is supported
   */
  supportsFormat: (format: string) => boolean;
};

/**
 * Plugin configuration from .kaiordrc.json
 */
export type PluginConfig = {
  /** Plugin name */
  name: string;

  /** Whether plugin is enabled */
  enabled: boolean;

  /** Plugin-specific options */
  options?: Record<string, unknown>;
};
