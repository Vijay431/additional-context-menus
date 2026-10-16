/**
 * Dependency Injection Container
 *
 * Central DI container for managing service lifecycles and dependencies.
 * Uses a lightweight container pattern without external dependencies.
 *
 * @description
 * The DI container provides:
 * - Service registration and resolution
 * - Singleton lifecycle management
 * - Dependency injection through constructors
 * - Type-safe service access
 *
 * This implementation uses a lightweight pattern that doesn't require
 * external DI libraries like InversifyJS, keeping the bundle small
 * while still providing the benefits of dependency injection.
 *
 * @category Dependency Injection
 * @module di/container
 */

import * as path from 'node:path';

import type {
  IAccessibilityService,
  ICodeAnalysisService,
  IConfigurationService,
  IFileDiscoveryService,
  IFileNamingConventionService,
  IFileSaveService,
  ILogger,
  IProjectDetectionService,
  ITerminalService,
} from './interfaces';
import { TYPES } from './types';

/**
 * Service factory type
 *
 * A function that creates a service instance.
 */
type ServiceFactory<T> = () => T;

/**
 * Service descriptor
 *
 * Contains information about a registered service.
 */
interface ServiceDescriptor<T> {
  /** The service factory function */
  factory: ServiceFactory<T>;
  /** The cached singleton instance */
  instance?: T;
  /** Whether this service has been instantiated */
  isInstantiated: boolean;
}

/**
 * Dependency Injection Container
 *
 * Manages service registration, resolution, and lifecycle.
 * All services are singletons by default.
 *
 * @example
 * ```typescript
 * // Register services
 * container.registerSingleton<ILogger>(
 *   TYPES.Logger,
 *   () => new Logger()
 * );
 *
 * // Resolve services
 * const logger = container.get<ILogger>(TYPES.Logger);
 * ```
 */
export class DIContainer {
  private services = new Map<symbol, ServiceDescriptor<unknown>>();
  private parent?: DIContainer;

  constructor(parent?: DIContainer) {
    if (parent !== undefined) {
      this.parent = parent;
    }
  }

  /**
   * Register a singleton service
   *
   * Registers a service factory that will be called once and cached.
   *
   * @param token - The DI token for the service
   * @param factory - Factory function that creates the service
   * @returns The container for chaining
   */
  registerSingleton<T>(token: symbol, factory: ServiceFactory<T>): this {
    this.services.set(token, {
      factory,
      instance: undefined,
      isInstantiated: false,
    });
    return this;
  }

  /**
   * Register an instance directly
   *
   * Registers a pre-created instance as a singleton.
   *
   * @param token - The DI token for the service
   * @param instance - The pre-created instance
   * @returns The container for chaining
   */
  registerInstance<T>(token: symbol, instance: T): this {
    this.services.set(token, {
      factory: () => instance,
      instance,
      isInstantiated: true,
    });
    return this;
  }

  /**
   * Resolve a service by token
   *
   * Returns the singleton instance for the given token.
   * Creates the instance on first access.
   *
   * @param token - The DI token for the service
   * @returns The service instance
   * @throws Error if service is not registered
   */
  get<T>(token: symbol): T {
    const descriptor = this.services.get(token);

    if (descriptor) {
      if (!descriptor.isInstantiated) {
        descriptor.instance = descriptor.factory();
        descriptor.isInstantiated = true;
      }
      return descriptor.instance as T;
    }

    if (this.parent) {
      return this.parent.get<T>(token);
    }

    throw new Error(`Service not registered: ${token.toString()}`);
  }

  /**
   * Check if a service is registered
   *
   * @param token - The DI token to check
   * @returns true if service is registered
   */
  has(token: symbol): boolean {
    return this.services.has(token) || (this.parent?.has(token) ?? false);
  }

  /**
   * Clear all registered services
   *
   * Clears all registrations and cached instances.
   * Useful for testing and resetting state.
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Create a child container
   *
   * Creates a new container that can fall back to this container
   * for services not registered in the child.
   *
   * @returns A new child container
   */
  createChild(): DIContainer {
    return new DIContainer(this);
  }
}

/**
 * Global DI container instance
 *
 * The main container used throughout the extension.
 */
export const container = new DIContainer();

/**
 * Initialize the DI container with all extension services
 *
 * This function sets up all service bindings and must be called
 * during extension activation.
 *
 * @param context - The VS Code extension context
 */
export async function initializeContainer(context: {
  subscriptions: { dispose(): void }[];
  extensionPath: string;
}): Promise<void> {
  // Dynamic imports to avoid circular dependencies
  // Core services (always loaded)
  const { Logger } = await import('../utils/logger');
  const { ConfigurationService } = await import('../services/configurationService');
  const { ProjectDetectionService } = await import('../services/projectDetectionService');
  const { FileDiscoveryService } = await import('../services/fileDiscoveryService');
  const { FileSaveService } = await import('../services/fileSaveService');
  const { TerminalService } = await import('../services/terminalService');
  const { FileNamingConventionService } = await import('../services/fileNamingConventionService');
  const { AccessibilityService } = await import('../services/accessibilityService');
  // Generator services are loaded lazily in command handlers for an optimized bundle

  // Register all services as singletons
  // Logger is the root service with no dependencies
  container.registerSingleton<ILogger>(TYPES.Logger, () => {
    const logger = Logger.getInstance();
    context.subscriptions.push({ dispose: () => logger.dispose() });
    return logger;
  });

  // Services that only depend on Logger
  container.registerSingleton<IConfigurationService>(TYPES.ConfigurationService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    return ConfigurationService.create(logger);
  });

  container.registerSingleton<IAccessibilityService>(TYPES.AccessibilityService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    return AccessibilityService.create(logger);
  });

  // Services that depend on Logger and Configuration
  container.registerSingleton<IProjectDetectionService>(TYPES.ProjectDetectionService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    const configService = container.get<IConfigurationService>(TYPES.ConfigurationService);
    return ProjectDetectionService.create(logger, configService);
  });

  container.registerSingleton<ITerminalService>(TYPES.TerminalService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    const configService = container.get<IConfigurationService>(TYPES.ConfigurationService);
    return TerminalService.create(logger, configService);
  });

  // Services that depend on Logger, Configuration, and ProjectDetection
  container.registerSingleton<IFileDiscoveryService>(TYPES.FileDiscoveryService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    const accessibilityService = container.get<IAccessibilityService>(TYPES.AccessibilityService);
    const configService = container.get<IConfigurationService>(TYPES.ConfigurationService);
    const projectDetection = container.get<IProjectDetectionService>(TYPES.ProjectDetectionService);
    return FileDiscoveryService.create(
      logger,
      accessibilityService,
      configService,
      projectDetection,
      configService.getFileDiscoveryCacheTTL(),
    );
  });

  // CodeAnalysisService is lazy-loaded to avoid bundling the TypeScript compiler in the core bundle
  container.registerSingleton<ICodeAnalysisService>(TYPES.CodeAnalysisService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    const lazyPath = path.join(context.extensionPath, 'dist', 'lazy', 'codeAnalysisService.js');
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, security/detect-non-literal-require
      const { CodeAnalysisService } = require(lazyPath);
      return CodeAnalysisService.create(logger);
    } catch (err) {
      logger.error(`Failed to load CodeAnalysisService from ${lazyPath}`, err);
      throw err;
    }
  });

  container.registerSingleton<IFileSaveService>(TYPES.FileSaveService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    const configService = container.get<IConfigurationService>(TYPES.ConfigurationService);
    const accessibilityService = container.get<IAccessibilityService>(TYPES.AccessibilityService);
    return FileSaveService.create(logger, configService, accessibilityService);
  });

  container.registerSingleton<IFileNamingConventionService>(TYPES.FileNamingConventionService, () =>
    FileNamingConventionService.getInstance(),
  );

  // Generator services are NOT registered here - they are loaded lazily via dynamic imports
  // in ContextMenuManager for an optimized initial bundle
}

/**
 * Resolve a service from the container
 *
 * Convenience function for getting services from the global container.
 *
 * @param token - The DI token
 * @returns The service instance
 */
export function getService<T>(token: symbol): T {
  return container.get<T>(token);
}

/**
 * Check if a service is registered
 *
 * @param token - The DI token
 * @returns true if service is registered
 */
export function hasService(token: symbol): boolean {
  return container.has(token);
}
