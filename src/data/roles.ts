import type { NavigationState } from '../types/types';

export type UserRole = 'coa' | 'province' | 'municipality' | 'federation' | 'club';

export type FederationScope = 'national' | 'provincial';

export interface UserRoleConfig {
  role: UserRole;
  /** Province the user belongs to (province, municipality, provincial federation) */
  provinciaId?: number;
  /** Municipality the user belongs to (municipality role) */
  municipioId?: number;
  /** Club the user belongs to (club role) */
  clubId?: number;
  /** Federation ID (federation role) */
  federationId?: number;
  /** Whether the federation is national or provincial scope */
  federationScope?: FederationScope;
  /** Sport this federation governs (filters data to this sport) */
  deporteId?: number;
}

/** Federation bound to a single sport: sport-comparison charts add nothing for it */
export function isSingleSportFederation(config: UserRoleConfig | null | undefined): boolean {
  return config?.role === 'federation' && config.deporteId != null;
}

/** Get the initial navigation state based on role */
export function getInitialNavigation(config: UserRoleConfig): NavigationState {
  switch (config.role) {
    case 'province':
      return { level: 'province', provinciaId: config.provinciaId };
    case 'municipality':
      return { level: 'city', provinciaId: config.provinciaId, municipioId: config.municipioId };
    case 'federation':
      if (config.federationScope === 'provincial' && config.provinciaId) {
        return { level: 'province', provinciaId: config.provinciaId };
      }
      return { level: 'country' };
    case 'club':
      return { level: 'country' }; // overridden once club data loads
    default:
      return { level: 'country' };
  }
}

/** Check if a navigation action is allowed for the role */
export function isNavigationAllowed(config: UserRoleConfig, target: NavigationState): boolean {
  switch (config.role) {
    case 'coa':
      return true;

    case 'province':
      if (target.level === 'country') return false;
      if (target.provinciaId && target.provinciaId !== config.provinciaId) return false;
      return true;

    case 'municipality':
      // Locked to their city and clubs within it
      if (target.level === 'country' || target.level === 'province') return false;
      if (target.municipioId && target.municipioId !== config.municipioId) return false;
      return true;

    case 'federation':
      if (config.federationScope === 'national') return true;
      // Provincial federation: cannot go to country level or another province
      if (target.level === 'country') return false;
      if (target.provinciaId && target.provinciaId !== config.provinciaId) return false;
      return true;

    case 'club':
      return false;

    default:
      return true;
  }
}

/** Check if province clicking on the map is allowed */
export function canClickProvince(config: UserRoleConfig): boolean {
  return config.role === 'coa' ||
    (config.role === 'federation' && config.federationScope === 'national');
}

/** Check if municipality clicking on the map is allowed */
export function canClickMunicipio(config: UserRoleConfig): boolean {
  return config.role === 'coa' ||
    config.role === 'province' ||
    (config.role === 'federation' && config.federationScope === 'national') ||
    (config.role === 'federation' && config.federationScope === 'provincial');
}

/** Label shown in the header subtitle for each role */
export function getRoleLabel(config: UserRoleConfig): string {
  switch (config.role) {
    case 'coa':       return 'Panel COA';
    case 'province':  return 'Panel Provincia';
    case 'municipality': return 'Panel Municipio';
    case 'federation':
      return config.federationScope === 'national'
        ? 'Panel Federación Nacional'
        : 'Panel Federación Provincial';
    case 'club':      return 'Panel Club';
    default:          return '';
  }
}
