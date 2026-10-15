/**
 * Dependency Injection Module
 *
 * Central export point for the DI system.
 *
 * @category Dependency Injection
 * @module di
 */

export { container, DIContainer, getService, hasService, initializeContainer } from './container';
export * from './interfaces';
export { type DiToken, TYPES } from './types';
